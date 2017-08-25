module DashCreator
  module ActsAsDashCreator

    def self.included(base)
      base.extend ClassMethods
    end

    module ClassMethods
      def acts_as_dash_creator
        has_many :dash_creator_filters, dependent: :destroy
        has_many :dash_creator_charts, dependent: :destroy
        has_many :dash_creator_dashboards, dependent: :destroy
      end
    end
  end
end
