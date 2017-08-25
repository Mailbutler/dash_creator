module DashCreator
  class Chart < ApplicationRecord
    attr_accessor :user_id
    belongs_to :user, class_name: DashCreator.user_class.to_s

    before_validation :set_user

    DashCreator::DashboardObject
        .find_or_create_by(
            name: 'Chart',
            code: 'chart',
            info: {model_name: 'DashCreator::Chart'},
            options: {}
        )

    def as_json(options = {})
      json = {
          name: name,
          data: data
      }
      json
    end

    private
      def set_user
        self.user = DashCreator.user_class.find(user_id)
      end
  end
end
