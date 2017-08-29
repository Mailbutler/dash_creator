module DashCreator
  module ActsAsDashboardObject

    def self.included(base)
      base.extend ClassMethods
    end

    module ClassMethods
      def acts_as_dashboard_object(name, options = {})
        DashCreator::DashboardObject.find_or_create_by(
            name: name,
            code: name.underscore,
            related_model: self.class.name,
            options: options
        )
      end
    end
  end
end
